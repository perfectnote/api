module.exports = (plop) => {
  plop.setGenerator("component", {
    description: "Create an endpoint",
    // User input prompts provided as arguments to the template
    prompts: [
      {
        // Raw text input
        type: "input",
        // Variable name for this input
        name: "filePath",
        // Prompt to display on command line
        message:
          "Enter the path where the file will be saved to (don't include neither the .js extension nor api/v1):",
      },
      {
        // Raw text input
        type: "input",
        // Variable name for this input
        name: "endpoint",
        // Prompt to display on command line
        message: "Enter the endpoint string:",
      },
      {
        // List input
        type: "list",
        // Variable name for this list
        name: "type",
        // Prompt to display on command line
        message: "Which type of endpoint do you want to create?",
        // Available options
        choices: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
    ],
    actions: [
      {
        // Add a new file
        type: "add",
        // Path for the new file
        path: "src/api/v1/{{pathCase filePath}}.js",
        // Handlebars template used to generate content of new file
        templateFile: "plop-templates/endpoint.js.hbs",
      },
      {
        // Append to existing file
        type: "append",
        path: "src/api/v1/api.js",
        pattern: `/* PLOP_INJECT_ENDPOINTS */`,
        template: `  router.{{lowerCase type}}("/{{endpoint}}", require("./{{pathCase filePath}}.js").default);`,
      },
    ],
  });
};
