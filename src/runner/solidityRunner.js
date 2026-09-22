import solc from 'solc';
import { createVM } from '@ethereumjs/vm';
import { hexToBytes, bytesToHex } from '@ethereumjs/util';
import { encodeFunctionData, decodeFunctionResult } from 'viem';

export async function runSolidityInVM({ task, code, mode, tests }) {
  const functionName = task.specification.functionName;

  const input = {
    language: 'Solidity',
    sources: { 'StudentContract.sol': { content: code } },
    settings: {
      outputSelection: {
        '*': { '*': ['abi', 'evm.bytecode'] }
      }
    }
  };

  let output;
  try {
    output = JSON.parse(solc.compile(JSON.stringify(input)));
  } catch (err) {
    return {
      ok: false,
      setupError: `Solidity compiler internal error: ${err.message}`,
      tests: [],
      stdout: []
    };
  }

  const compileErrors = (output.errors || []).filter((e) => e.severity === 'error');
  if (compileErrors.length > 0) {
    const errorMsg = compileErrors
      .map((e) => e.formattedMessage || e.message)
      .join('\n')
      .slice(0, 1000);

    return {
      ok: false,
      setupError: null,
      tests: tests.map((t) => ({
        id: t.id,
        label: t.label,
        group: t.group,
        visible: Boolean(t.visible),
        passed: false,
        error: errorMsg,
        durationMs: 0,
        memoryBytes: 0,
        size: t.size || 0,
        input: t.visible ? t.args : undefined,
        expected: t.visible ? t.expected : undefined
      })),
      stdout: []
    };
  }

  const contracts = output.contracts?.['StudentContract.sol'] || {};
  let targetAbi = null;
  let targetBytecode = null;

  for (const [, contractData] of Object.entries(contracts)) {
    const hasFunction = contractData.abi?.some((item) => item.type === 'function' && item.name === functionName);
    if (hasFunction) {
      targetAbi = contractData.abi;
      targetBytecode = contractData.evm?.bytecode?.object;
      break;
    }
  }

  if (!targetAbi || !targetBytecode) {
    const msg = `Define a contract with function "${functionName}" matching the specification.`;
    return {
      ok: false,
      setupError: msg,
      tests: tests.map((t) => ({
        id: t.id,
        label: t.label,
        group: t.group,
        visible: Boolean(t.visible),
        passed: false,
        setupError: msg,
        durationMs: 0,
        memoryBytes: 0,
        size: t.size || 0
      })),
      stdout: []
    };
  }

  let vm;
  let contractAddress;
  try {
    vm = await createVM();
    const deployResult = await vm.evm.runCall({
      data: hexToBytes('0x' + targetBytecode),
      gasLimit: 0xffffffffn
    });
    contractAddress = deployResult.createdAddress;
  } catch (err) {
    return {
      ok: false,
      setupError: `Contract deployment failed: ${err.message}`,
      tests: [],
      stdout: []
    };
  }

  const results = [];
  for (const testCase of tests) {
    const start = performance.now();
    try {
      const formattedArgs = testCase.args.map((arg) => {
        if (Array.isArray(arg)) {
          return arg.map((x) => (typeof x === 'number' ? BigInt(x) : x));
        }
        if (typeof arg === 'number') {
          return BigInt(arg);
        }
        return arg;
      });

      const callData = encodeFunctionData({
        abi: targetAbi,
        functionName,
        args: formattedArgs
      });

      const callResult = await vm.evm.runCall({
        to: contractAddress,
        data: hexToBytes(callData),
        gasLimit: 0xffffffffn
      });

      const durationMs = performance.now() - start;

      if (callResult.execResult.exceptionError) {
        results.push({
          id: testCase.id,
          label: testCase.label,
          group: testCase.group,
          visible: Boolean(testCase.visible),
          passed: false,
          error: `EVM Execution Error: ${callResult.execResult.exceptionError.error}`,
          durationMs,
          memoryBytes: Number(callResult.execResult.executionGasUsed || 0),
          size: testCase.size || 0,
          input: testCase.visible ? testCase.args : undefined,
          expected: testCase.visible ? testCase.expected : undefined
        });
        continue;
      }

      const decoded = decodeFunctionResult({
        abi: targetAbi,
        functionName,
        data: bytesToHex(callResult.execResult.returnValue)
      });

      const actualVal = typeof decoded === 'bigint' ? Number(decoded) : decoded;
      const expectedVal = typeof testCase.expected === 'bigint' ? Number(testCase.expected) : testCase.expected;
      const passed = JSON.stringify(actualVal) === JSON.stringify(expectedVal);

      results.push({
        id: testCase.id,
        label: testCase.label,
        group: testCase.group,
        visible: Boolean(testCase.visible),
        passed,
        durationMs,
        memoryBytes: Number(callResult.execResult.executionGasUsed || 0),
        size: testCase.size || 0,
        actual: actualVal,
        expected: expectedVal,
        input: testCase.visible ? testCase.args : undefined
      });
    } catch (err) {
      const durationMs = performance.now() - start;
      results.push({
        id: testCase.id,
        label: testCase.label,
        group: testCase.group,
        visible: Boolean(testCase.visible),
        passed: false,
        error: err.message || String(err),
        durationMs,
        memoryBytes: 0,
        size: testCase.size || 0,
        input: testCase.visible ? testCase.args : undefined,
        expected: testCase.visible ? testCase.expected : undefined
      });
    }
  }

  const allPassed = results.every((r) => r.passed);
  return {
    ok: allPassed,
    setupError: null,
    tests: results,
    stdout: []
  };
}
