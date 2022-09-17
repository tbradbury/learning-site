import HomePage from '../components/homepage';

export default HomePage;

export async function getStaticProps() {
  const posts = [
    { title: 'Post one', id: 'one' },
    { title: 'Post two', id: 'two' },
    { title: 'Post three', id: 'three' },
    { title: 'Post four', id: 'four' },
    // { title: 'Post 5', id: '5' },
    // { title: 'Post 6', id: '6' },
    // { title: 'Post 7', id: '7' },
    // { title: 'Post 8', id: '8' },
    // { title: 'Post 9', id: '9' },
  ];
  return {
    props: {
      posts,
    },
  };
}
