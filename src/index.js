import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import apiSetup from "./api/v1/api";

dotenv.config();
const app = express();

app.disable("x-powered-by");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-bearer-token")());

// Setup API
app.use("/api/v1", apiSetup(express.Router()));

var port = process.env.PORT || 5000;
app.listen(port);
console.log("[PerfectNote] Listening on port " + port);
