import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import {useQuery, gql} from '@apollo/client';

function App() {
  return (
    <div className='App'>
      <Messages />
      <AddMessage />
    </div>
  );
}

export default App;

const Messages = () => {
  const {data, loading, subscribeToMore} = useQuery(GET_MESSAGES);
  console.log(data);
  useEffect(() => {
    subscribeToMore({
      document: MESSAGE_ADDED,
      updateQuery: (prev, {subscriptionData}) => {
        console.log(subscriptionData);
        if (!subscriptionData) return prev;
        const newMessage = subscriptionData.data.messageAdded;
        console.log('newMessage', newMessage);
        const newList = Object.assign({}, prev, {
          messages: [...prev.messages, newMessage],
        });
        console.log('new list', newList);
        return newList;
      },
    });
  }, []);
  return (
    !loading &&
    data.messages.map((message, i) => (
      <div key={i}>
        {i + 1} - {message.text}
      </div>
    ))
  );
};

const AddMessage = () => {
  const [text, setText] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:3002/newMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({text}),
    });
    setText('');
  };
  return (
    <div>
      <form>
        <input
          type='text'
          name='text'
          id='text'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={handleSubmit}>Send</button>
      </form>
    </div>
  );
};

const GET_MESSAGES = gql`
  query {
    messages {
      id
      text
    }
  }
`;

const MESSAGE_ADDED = gql`
  subscription {
    messageAdded {
      id
      text
    }
  }
`;
