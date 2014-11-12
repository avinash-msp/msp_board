<?php
  class Board
  {
    public function __construct($id, $name, $description, $projects)
    {
      $this->board_id = $id;
      $this->board_title = $name;
      $this->board_desc = $description;
      $this->projects = $projects;
    }
  }

  if (!empty($_GET["id"])) {
    require_once "settings.php";
    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

    if (!$db->connect_errno) {
      $id = $db->escape_string($_GET["id"]);
      if ($board_result = $db->query("SELECT * FROM discuss_boards WHERE id = $id")) {
        if ($board_row = $board_result->fetch_assoc()) {
          $projects = array();
          if ($project_result = $db->query("SELECT title FROM discuss_projects WHERE board_id = $id")) {
            while ($project_row = $project_result->fetch_assoc()) {
              $projects[] = $project_row["title"];
            }
            $project_result->close();
          }
          $board = new Board(intval($board_row["id"]), $board_row["name"], $board_row["description"], $projects);
          echo json_encode($board);
        }
        $board_result->close();
      }
      $db->close();
    }
  }
?>