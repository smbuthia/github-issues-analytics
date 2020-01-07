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
PG_HOST=<postgresql-connection-host>
PG_DATABASE=<postgresql-database>
PG_USER=<postgresql-user-name>
PG_PASSWORD=<postgresql-user-password>
```

#### index.js

This is the entry point of the application. 

By default, the application will start populating weekly information from 13 weeks ago (approx 3 months) to the last full week.
