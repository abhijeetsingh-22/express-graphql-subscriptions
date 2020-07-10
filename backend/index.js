const express = require('express');
const {PubSub} = require('graphql-subscriptions');
const {createServer} = require('http');
const {SubscriptionServer} = require('subscriptions-transport-ws');
const {makeExecutableSchema} = require('graphql-tools');
const {
  execute,
  subscribe,
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLList,
} = require('graphql');
const {graphqlHTTP} = require('express-graphql');
const gql = require('graphql-tag');
const cors = require('cors');
const message = require('./message');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const pubsub = new PubSub();
const typeDefs = gql`
  type Query {
    message: [message]
  }
  type Subscription {
    messageAdded: message
  }
  type message {
    id: String
    text: String
  }
`;
const resolvers = {
  Query: {
    message: {},
  },
  Subscription: {
    messageAdded: {
      subscribe: () => {
        console.log('sending new message');
        return pubsub.asyncIterator('newMessage');
      },
    },
  },
};
const messageType = new GraphQLObjectType({
  name: 'Message',
  fields: {
    id: {type: GraphQLString},
    text: {type: GraphQLString},
  },
});
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    messages: {
      type: GraphQLList(messageType),
      args: {id: {type: GraphQLString}},
      async resolve(parentValue, args) {
        const messages = await message.find();
        return messages;
      },
    },
  },
});
const schema = new GraphQLSchema({
  query: RootQuery,
});
const PORT = 3002;
const WS_PORT = 3003;
const ws = createServer((req, res) => {
  res.writeHead(400);
  res.end();
});

ws.listen(WS_PORT, () => console.log(`websocket running on http://localhost:${WS_PORT}`));
const subscriptionServer = SubscriptionServer.create(
  {
    schema: makeExecutableSchema({typeDefs, resolvers}),
    execute,
    subscribe,
    onConnect: () => console.log('client connected to ws'),
  },
  {
    server: ws,
    path: '/graphql',
  }
);
app.use(
  '/graphql',
  graphqlHTTP((req) => {
    // console.log(req.body);
    return {schema, graphiql: true};
  })
);
app.post('/newMessage', async function (req, res) {
  const {text} = req.body;
  console.log(req.body);
  //   console.log(text);
  const newMessage = await message.create({text});
  pubsub.publish('newMessage', {messageAdded: newMessage});
  res.status(200).send('message sent');
});
app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`));
