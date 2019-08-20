## GitHub Issues Analytics

This application compiles a summary of certain KPIs for support issues logged on GitHub.

### Setup

#### Dotenv

Create a `.env` file in the base directory and add the following variables:

```
GH_REPOSITORY=<repository-name>
GH_ORGANIZATION=<organization-name>
GH_USER=<user-name>
GH_USER_AGENT=<user-agent>
CLIENT_ID=<client-id>
CLIENT_SECRET=<client-secret>
PG_HOST=<postgresql-connection-host>
PG_DATABASE=<postgresql-database>
PG_USER=<postgresql-user-name>
PG_PASSWORD=<postgresql-user-password>
```

#### app.js

This is the entry point of the application and contains the functions that will be performed. By default, the application will start populating information from the current date (for daily metrics) and the most recent Monday (for weekly metrics).

The table names can be specified in `app.js` as arguments when the function `writeToIssuesTable` is called.