const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
    SELECT
        *
    FROM
        todo 
    WHERE    
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT *
    FROM todo
    WHERE id=${todoId};`;
  const todo1 = await db.get(getTodo);
  response.send(todo1);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createQuery = `
    INSERT INTO
      todo(id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  const createTodo = await db.run(createQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  let displayText = "";
  let updatingQuery = "";

  const { todoId } = request.params;
  const { todo, priority, status } = request.body;
  const requestBody = request.body;
  switch (true) {
    case requestBody.priority !== undefined:
      updatingQuery = `
              UPDATE todo
              SET priority='${priority}'
              WHERE id=${todoId};`;
      displayText = "Priority Updated";
      break;
    case requestBody.status !== undefined:
      updatingQuery = `
              UPDATE todo
              SET status='${status}'
              WHERE id=${todoId};`;
      displayText = "Status Updated";
      break;
    case requestBody.todo !== undefined:
      updatingQuery = `
              UPDATE todo
              SET todo='${todo}'
              WHERE id=${todoId};`;
      displayText = "Todo Updated";
      break;
  }
  const dat = await db.run(updatingQuery);
  response.send(displayText);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM todo
    WHERE id=${todoId};`;
  const q1 = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
