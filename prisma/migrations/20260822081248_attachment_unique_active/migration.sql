-- At most one active GRADER and one active CHECKER per problem.
CREATE UNIQUE INDEX "one_active_grader_per_problem"
  ON "ProblemAttachment" ("problemId")
  WHERE ("active" AND "kind" = 'GRADER');

CREATE UNIQUE INDEX "one_active_checker_per_problem"
  ON "ProblemAttachment" ("problemId")
  WHERE ("active" AND "kind" = 'CHECKER');