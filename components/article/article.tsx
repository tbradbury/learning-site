import Layout from '../layout';
import { H1, Block, styled, getColorCssFromTheme } from 'newskit';
import Link from 'next/link';
import { ReactNode } from 'react';

const StyledSpan = styled.span`
  ${getColorCssFromTheme('color', 'blue050')}
`;

const StyledMain = styled.main`
  width: 100%;
  max-width: 800px;
`;

interface ArticleProps {
  title: string;
  contentHtml?: string;
  children?: ReactNode;
}

const Article: React.FC<ArticleProps> = ({ title, contentHtml, children }) => (
  <Layout>
    <StyledMain>
      <Block marginBlockEnd='space050'>
        <H1>{title}</H1>
      </Block>
      <Block marginBlockEnd='space050'>
        {contentHtml && (
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        )}
        {children}
      </Block>
      <Link href='/'>
        <a>
          <StyledSpan>← Back to home</StyledSpan>
        </a>
      </Link>
    </StyledMain>
  </Layout>
);

export default Article;
