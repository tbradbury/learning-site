import Article from '../components/article';
import List, { ListType } from '../components/list';

const list: ListType[] = [
  { text: 'Add basic config - lint, prettier, jest', lineThrough: true },
  {
    text: 'Follow next tutorial on basic fetching',
    lineThrough: true,
    href: '/posts/basic-site',
  },
  {
    text: 'Add CircleCi basic! - have tutorial?',
    lineThrough: true,
    href: '/posts/circleci-basics',
  },
  {
    text: 'Dockerize site - have tutorial',
    lineThrough: true,
    href: '/posts/build-docker-image',
  },
  { text: 'AWS ECS - basics', lineThrough: true, href: '/posts/ecs-basics' },
  {
    text: 'AWS EKS - hopefully build on above',
    lineThrough: true,
    href: '/posts/eks-basics',
  },
  {
    text: 'Static Site with s3 and Cloudfront',
    lineThrough: true,
    href: '/posts/s3-static-site',
  },
  { text: 'Undate Personal site - with this' },
  { text: 'Check Udemy tutorial for other AWS you can do update this list' },
];

const ToDo = () => (
  <Article title='To Do List'>
    <List list={list} />
  </Article>
);

export default ToDo;
