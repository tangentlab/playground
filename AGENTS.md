# Project instructions

- Put each experiment in its own `exp/<descriptive-name>/` folder.
- Keep experiments self-contained. Avoid shared infrastructure until
  multiple experiments need it.
- Follow existing conventions within an experiment.
- Prefer the simplest working implementation. Add dependencies only
  when they provide a clear benefit.
- Preserve unrelated work. Don’t reorganize or refactor outside the task.
- Never commit secrets, credentials, or local environment files.

## Documentation

- Each experiment should have a README explaining its purpose,
  how to run it, and any required environment variables.
- Update the root README when adding an experiment or changing
  repository setup or usage.
- Clearly label unfinished experiments and known limitations.

## Validation

- Run checks appropriate to the change.
- For UI changes, inspect the result in a browser when possible.
- Report what was verified and anything that could not be verified.
