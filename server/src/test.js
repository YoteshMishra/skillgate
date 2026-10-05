const postgresService = require("./postgres_service");

async function creating_adding_customer_data() {
  // Make sure the table exists
  await postgresService.createCustomerTable();

  // Call the "create and add" function from postgres_service.js
  const newCustomer = await postgresService.addCustomer(
    "Test Customer",
    "test.customer@example.com"
  );

  return newCustomer.id;
}

async function delete_one_column(id) {
  // Call the delete function from postgres_service.js
  await postgresService.deleteCustomer("id", id);
}

async function main_execute() {
  const newId = await creating_adding_customer_data();
//   if (newId) {
//     await delete_one_column(newId);
//   }
}

main_execute();