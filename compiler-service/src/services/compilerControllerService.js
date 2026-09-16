import { compileCpp } from "./compilerService.js";

export async function compileCodeService(language, code, stdin = " ") {
  if (!language) {
    return {
      status: 400,
      data: {
        error: "Language is required",
      },
    };
  }

  if (!code || !code.trim()) {
    return {
      status: 400,
      data: {
        error: "Code is required",
      },
    };
  }

  if (language !== "cpp") {
    return {
      status: 400,
      data: {
        error: "Only C++ is supported",
      },
    };
  }

  console.log("Sending data for compiling");

  const result = await compileCpp(code, stdin);

  console.log("Compilation completed");

  if (!result.success) {
    return {
      status: 200,
      data: {
        success: false,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      },
    };
  }

  return {
    status: 200,
    data: {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
    },
  };
}
