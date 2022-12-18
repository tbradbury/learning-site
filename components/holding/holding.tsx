import Layout from '../layout';
import Image from 'next/image';
import { Block, styled, H2 } from 'newskit';

const ImageContainer = styled(Block)`
  width: 100%;
  max-width: 502px;
  height: 502px;
  position: relative;
  @media (max-width: 510px) {
    max-width: 302px;
    height: 302px;
  }
`;

const Holding = () => (
  <Layout showHeader text='Tim Bradbury'>
    <ImageContainer marginBlockEnd='space050'>
      <Image
        src='/BEARD.jpg'
        fill
        alt='logo'
      />
    </ImageContainer>
    <H2>Holding Page - Site under construction</H2>
  </Layout>
);

export default Holding;
