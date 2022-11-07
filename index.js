import { createServer, createPubSub } from "@graphql-yoga/node";
import { uuid } from "uuidv4";

const pubSub = createPubSub();

const users = [];

// Provide your schema
const server = createServer({
  schema: {
    typeDefs: /* GraphQL */ `
      type User {
        id: ID!
        name: String!
      }

      input CreateUserInput {
        name: String!
      }

      type Query {
        hello: String
      }

      type Subscription {
        randomNumber: Float!
        count: Int
        userSubscription: User
      }

      type Mutation {
        broadcastRandomNumber: Boolean
        addUser(data: CreateUserInput): User
      }
    `,
    resolvers: {
      Query: {
        hello: () => "world",
      },
      Subscription: {
        randomNumber: {
          // subscribe to the randomNumber event
          subscribe: () => pubSub.subscribe("randomNumber"),
          resolve: (payload) => payload,
        },
        count: {
          subscribe: (_, __) => {
            let count = 0;
            setInterval(() => {
              count++;
              pubSub.publish("count", { count });
            }, 1000);
            return pubSub.subscribe("count");
          },
        },

        userSubscription: {
          subscribe: () => pubSub.subscribe("newUser"),
          resolve: (payload) => payload,
        },
      },
      Mutation: {
        broadcastRandomNumber(_, args) {
          // publish a random number
          pubSub.publish("randomNumber", Math.random());
        },
        addUser(_, { data }) {
          const user = {
            id: uuid(),
            ...data,
          };
          users.push(user);
          pubSub.publish("newUser", user);
          return user;
        },
      },
    },
  },
});

server.start();
