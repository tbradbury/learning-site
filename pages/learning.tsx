import HomePage from '../components/homepage';
import { getSortedPostsData } from '../lib/md-build-utils';

export default HomePage;

export async function getStaticProps() {
  const posts = getSortedPostsData();
  return {
    props: {
      posts,
    },
  };
}
