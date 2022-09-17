import { ReactNode } from 'react';
import Footer from '../footer';
import Header from '../header';
import { styled, Block } from 'newskit';

const PageWrapper = styled(Block)`
  position: relative;
  min-height: 100vh;
`;

const ContentWrapper = styled(Block)`
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-bottom: 150px;
`;

const Layout: React.FC<{ children: ReactNode; showHeader?: boolean }> = ({
  children,
  showHeader,
}) => (
  <PageWrapper>
    <Block paddingBlockEnd='space070' />
    {showHeader && <Header />}
    <ContentWrapper>{children}</ContentWrapper>
    <Footer />
  </PageWrapper>
);

export default Layout;
