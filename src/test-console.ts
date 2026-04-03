type ConsoleMethod = "error" | "warn";
type ConsoleMatcher =
  | string
  | RegExp
  | ((args: unknown[], rendered: string) => boolean);

interface ConsoleAllowance {
  method: ConsoleMethod;
  matcher?: ConsoleMatcher;
  remaining: number;
}

interface UnexpectedConsoleCall {
  method: ConsoleMethod;
  args: unknown[];
  rendered: string;
}

const allowances: ConsoleAllowance[] = [];
const unexpectedCalls: UnexpectedConsoleCall[] = [];

const renderConsoleArg = (arg: unknown): string => {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`;
  }

  if (typeof arg === "string") {
    return arg;
  }

  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
};

const renderConsoleArgs = (args: unknown[]): string =>
  args.map(renderConsoleArg).join(" ");

const matchesAllowance = (
  matcher: ConsoleMatcher | undefined,
  args: unknown[],
  rendered: string,
): boolean => {
  if (!matcher) return true;
  if (typeof matcher === "string") return rendered.includes(matcher);
  if (matcher instanceof RegExp) return matcher.test(rendered);
  return matcher(args, rendered);
};

const consumeAllowance = (
  method: ConsoleMethod,
  args: unknown[],
  rendered: string,
): boolean => {
  const allowance = allowances.find(
    (entry) =>
      entry.method === method &&
      entry.remaining > 0 &&
      matchesAllowance(entry.matcher, args, rendered),
  );

  if (!allowance) return false;

  allowance.remaining -= 1;
  return true;
};

const installConsoleGuard = () => {
  const consoleTarget = console as Console & {
    __codexConsoleGuardInstalled?: boolean;
  };

  if (consoleTarget.__codexConsoleGuardInstalled) return;

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    const rendered = renderConsoleArgs(args);
    if (!consumeAllowance("error", args, rendered)) {
      unexpectedCalls.push({ method: "error", args, rendered });
      if (process.env.DEBUG_TEST_CONSOLE === "1") {
        originalError(...args);
      }
    }
  };

  console.warn = (...args: unknown[]) => {
    const rendered = renderConsoleArgs(args);
    if (!consumeAllowance("warn", args, rendered)) {
      unexpectedCalls.push({ method: "warn", args, rendered });
      if (process.env.DEBUG_TEST_CONSOLE === "1") {
        originalWarn(...args);
      }
    }
  };

  consoleTarget.__codexConsoleGuardInstalled = true;
};

const normalizeTimes = (times: number | undefined): number => {
  if (typeof times !== "number" || Number.isNaN(times)) return 1;
  return Math.max(0, Math.floor(times));
};

export const allowConsoleError = (
  matcher?: ConsoleMatcher,
  times?: number,
): void => {
  allowances.push({
    method: "error",
    matcher,
    remaining: normalizeTimes(times),
  });
};

export const allowConsoleWarn = (
  matcher?: ConsoleMatcher,
  times?: number,
): void => {
  allowances.push({
    method: "warn",
    matcher,
    remaining: normalizeTimes(times),
  });
};

export const resetConsoleAllowanceState = (): void => {
  allowances.length = 0;
  unexpectedCalls.length = 0;
};

export const assertNoUnexpectedConsoleCalls = (): void => {
  if (unexpectedCalls.length === 0) return;

  const details = unexpectedCalls
    .map(
      (entry, index) =>
        `${index + 1}. console.${entry.method}: ${entry.rendered || "[no message]"}`,
    )
    .join("\n");

  throw new Error(`Unexpected console output detected:\n${details}`);
};

installConsoleGuard();

