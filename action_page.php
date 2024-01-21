<?php
// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $selectedSubject = $_POST["course"];
    $selectedTopic = $_POST["course number"];

    // Process the data (you can perform database operations or other actions here)

    // Redirect or generate a response as needed
    header("Location: /success_page.php"); // Redirect to a success page
    exit();
}
?>
