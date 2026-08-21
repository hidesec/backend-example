import "@lang/reflect-metadata";
import path from "path";
import { componentScan } from "@config/component-scan";

const APP_SCAN_DIRS = ["repositories", "services", "config/beans", "controllers", "advice", "auth", "tasks"];

componentScan(path.join(__dirname), APP_SCAN_DIRS)