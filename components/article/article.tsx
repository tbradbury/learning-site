import Layout from '../layout';
import { H1, Block, styled, getColorCssFromTheme, Global, css } from 'newskit';
import Link from 'next/link';
import { ReactNode } from 'react';
import Date from '../date';

const StyledSpan = styled.span`
  ${getColorCssFromTheme('color', 'blue050')}
`;

const StyledMain = styled.main`
  width: 100%;
  max-width: 800px;
`;

interface ArticleProps {
  title: string;
  date?: string;
  contentHtml?: string;
  children?: ReactNode;
}

const ArticleStyling = css`
  pre code {
    background-color: #eee;
    border: 1px solid #999;
    display: block;
    padding: 20px;
    -webkit-overflow-scrolling: touch;
    overflow-x: scroll;
  }
  a {
    color: #577ffb;
  }
`;

const Article: React.FC<ArticleProps> = ({
  title,
  date,
  contentHtml,
  children,
}) => (
  <>
    <Global styles={ArticleStyling} />
    <Layout>
      <StyledMain>
        <Block marginBlockEnd='space050'>
          <H1>{title}</H1>
        </Block>
        {date && (
          <Block>
            <Date
              dateString={date}
              options={{
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }}
            />
          </Block>
        )}
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
  </>
);

export default Article;
