<?php
  class Project
  {
    public function __construct($id, $title, $description, $topics)
    {
      $this->project_id = $id;
      $this->project_title = $title;
      $this->project_desc = $description;
      $this->topics = $topics;
    }
  }
  class Topic
  {
    public function __construct($title, $description)
    {
      $this->title = $title;
      $this->description = $description;
    }
  }

  if (!empty($_GET["id"])) {
    require_once "settings.php";
    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

    if (!$db->connect_errno) {
      $id = $db->escape_string($_GET["id"]);
      if ($project_result = $db->query("SELECT * FROM discuss_projects WHERE id = $id")) {
        if ($project_row = $project_result->fetch_assoc()) {
          $topics = array();
          if ($topic_result = $db->query("SELECT title, description FROM discuss_topics WHERE project_id = $id")) {
            while ($topic_row = $topic_result->fetch_assoc()) {
              $topics[] = new Topic($topic_row["title"], $topic_row["description"]);
            }
            $topic_result->close();
          }
          $project = new Project(intval($project_row["id"]), $project_row["title"], $project_row["description"], $topics);
          echo json_encode($project);
        }
        $project_result->close();
      }
      $db->close();
    }
  }
?>