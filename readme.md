# Social Media App

This project is primarily a **backend** project. The frontend was mostly completed a year ago on a frontend course.

The backend was created with the use of NestJS and has the following features:

- Rest API that handles all the usual CRUD operations and relation handling
- Implemented in 2 versions: one that uses a [Postgres db](https://github.com/josipslavic/social-media-app/blob/main/backend/src/pg) and one that uses [MongoDB](https://github.com/josipslavic/social-media-app/blob/main/backend/src/mongo) (Mongo implementation is way slower since an app of such nature requires a lot of relations, however it's still implemented to display knowledge of MongoDB), to use either databse just set the DATABASE .env variable to either `pg` or `mongo` and their respective modules will be initialized
- Has unit testing and database integration testing (only for the postgres implementation of [AuthService](https://github.com/josipslavic/social-media-app/blob/main/backend/src/pg/auth/auth.service.spec.ts) and [UserService](https://github.com/josipslavic/social-media-app/blob/main/backend/src/pg/user/user.service.spec.ts), since this is a portfolio project that's only supposed to display unit testing knowledge further testing would be unnecessary) along with mock classes of common NestJS classes
- Real time communication with frontend with the help of WebSockets (socket.io) which is located in the [events](https://github.com/josipslavic/social-media-app/blob/main/backend/src/pg/events) folder.
- Authentication with a reset password feature which sends a reset token to the user's email address and protected api routes
