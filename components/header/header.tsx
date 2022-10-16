import { TitleBar, Block, styled, getColorCssFromTheme } from 'newskit';

const StyledSpan = styled.span`
  ${getColorCssFromTheme('color', 'blue050')}
`;

interface HeaderProps {
  text?: string;
}

const Header: React.FC<HeaderProps> = ({ text }) => (
  <Block marginBlockEnd='space080'>
    <TitleBar
      headingAs='h1'
      overrides={{
        stylePreset: 'headerDisplay',
        heading: {
          typographyPreset: 'headerDisplay',
        },
      }}
    >
      {text ? (
        text
      ) : (
        <>
          Welcome to <br />
          <StyledSpan>Learning by Building</StyledSpan> Tutorial Site
        </>
      )}
    </TitleBar>
  </Block>
);

export default Header;
