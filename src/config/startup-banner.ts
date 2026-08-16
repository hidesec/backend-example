// config/startup-banner.ts
import { env } from "./env";
import chalk from "chalk"; // opsional, untuk warna

export function printStartupBanner(port: number): void {
  const banner = `
${chalk.cyan("╔══════════════════════════════════════════════╗")}
${chalk.green("         Server started successfully")}
${chalk.dim("  Environment")} : ${chalk.yellow(env.NODE_ENV)}
${chalk.dim("  Port")}        : ${chalk.yellow(port)}
${chalk.dim("  URL")}         : ${chalk.blue(`http://localhost:${port}`)}
${chalk.dim("  Health")}      : ${chalk.blue(`http://localhost:${port}/health`)}
${chalk.dim("  PID")}         : ${process.pid}
${chalk.dim("  Node")}        : ${process.version}
${chalk.cyan("╚══════════════════════════════════════════════╝")}
`;

  console.log(banner); // ← langsung console.log, bukan logger.info
}