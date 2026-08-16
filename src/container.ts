import "reflect-metadata";
import path from "path";
import { componentScan } from "@config/component-scan";

componentScan(path.join(__dirname))