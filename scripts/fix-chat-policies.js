// Fix chat policies script

const { createClient } = require("../src/lib/supabase/client");
const fs = require("fs");
const path = require("path");

async function fixChatPolicies() {
  try {
    console.log("Applying chat policy fixes...");

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "sql", "fix-chat-policies.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split SQL into separate statements
    const statements = sql
      .split(";")
      .filter((statement) => statement.trim() !== "")
      .map((statement) => statement + ";");

    // Initialize Supabase client
    const supabase = createClient();
    // Execute each SQL statement
    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: statement,
      });
      if (error) {
        console.error(`Error executing SQL: ${statement}`);
        console.error(error);
      }
    }

    console.log("Chat policy fixes applied successfully!");
  } catch (error) {
    console.error("Failed to apply chat policy fixes:", error);
  }
}

// Run the function
fixChatPolicies();
