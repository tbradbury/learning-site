import { CardInset, H2, P, Block, styled } from 'newskit';

interface TeaserProps {
  heading: string;
  href?: string;
  description?: string;
  role?: string;
  centerHeader?: boolean;
}

const StyledH2 = styled(H2)<{ centerHeader?: boolean }>`
  text-align: ${({ centerHeader }) => (centerHeader ? 'center' : 'left')};
`;

const Teaser: React.FC<TeaserProps> = ({
  heading,
  href,
  description,
  role,
  centerHeader,
}) => (
  <CardInset
    href={href}
    role={role}
    overrides={{
      stylePreset: 'teaserWithBorder',
      teaserContainer: { stylePreset: 'teaseContainer' },
    }}
  >
    <StyledH2
      role={`${role}-title`}
      centerHeader={centerHeader}
      overrides={{ stylePreset: 'teaserInherit' }}
    >
      {heading}
    </StyledH2>
    {description && (
      <>
        <Block marginBlockEnd='space030' />
        <P
          overrides={{ stylePreset: 'teaserInherit' }}
          role={`${role}-description`}
        >
          {description}
        </P>
      </>
    )}
  </CardInset>
);

export default Teaser;
