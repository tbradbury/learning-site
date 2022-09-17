import Image from 'next/image';
import { styled, getColorCssFromTheme } from 'newskit';

const StyledFooter = styled.footer`
  width: 100%;
  height: 100px;
  border-top-width: 1px;
  border-top-style: solid;
  ${getColorCssFromTheme('borderTopColor', 'neutral030')}
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 0px;
`;

const StyledLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  ${getColorCssFromTheme('color', 'blue050')}
  text-decoration: none;
`;

const StyledSpan = styled.span`
  display: inline-flex;
  margin-left: 0.5rem;
`;

const Footer = () => (
  <StyledFooter>
    <StyledLink href='/' target='_blank' rel='noopener noreferrer'>
      Powered by{' '}
      <StyledSpan>
        <Image src='/favicon-32x32.png' alt='My Logo' width={18} height={18} />
      </StyledSpan>
    </StyledLink>
  </StyledFooter>
);

export default Footer;
