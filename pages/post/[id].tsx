import Article from '../../components/article';

import { getAllPostIds, getPostData } from '../../lib/md-build-utils';

const Post = ({ postData }: any) => <Article {...postData} />;

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: any) {
  const postData = await getPostData(params.id);
  return {
    props: {
      postData,
    },
  };
}

export default Post;
