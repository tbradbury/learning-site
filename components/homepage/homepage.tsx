import { H2, GridLayout, Block } from 'newskit';
import Layout from '../layout';
import Teaser from '../teaser';

interface HomePageProps {
  posts: { title: string; id: string }[];
}

const HomePage: React.FC<HomePageProps> = ({ posts = [] }) => (
  <Layout showHeader>
    <main>
      <Block marginBlockEnd='space080'>
        <GridLayout
          columns={{
            xs: '1fr',
            md: '1fr 1fr',
          }}
          columnGap='space040'
          rowGap='space040'
          overrides={{ maxWidth: '800px' }}
        >
          <Teaser
            heading='Intention &rarr;'
            href='/intention'
            description='Use this site to learn tech and put blog tutorials on it.'
            role='intention'
          />

          <Teaser
            heading='To Do &rarr;'
            href='/todo'
            description='List on objective to learn by building!'
            role='todo'
          />
        </GridLayout>
      </Block>
      <Block marginBlockEnd='space050'>
        <H2>Posts</H2>
      </Block>
      <Block
        marginInline={{
          md: 'space080',
        }}
        marginBlockEnd='space030'
      >
        <GridLayout
          columns={{
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          }}
          columnGap='space050'
          rowGap='space040'
          overrides={{ maxWidth: '800px' }}
        >
          {posts.map(({ title, id }) => (
            <Teaser
              key={id}
              heading={title}
              href={`post/${id}`}
              role={`post-${id}`}
              centerHeader
            />
          ))}
        </GridLayout>
      </Block>
    </main>
  </Layout>
);

export default HomePage;
