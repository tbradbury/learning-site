import { CardInset, H2, P, Block, styled } from 'newskit';

interface TeaserProps {
  heading: string;
  href?: string;
  description?: string;
  role?: string;
  centerHeader?: boolean;
  verticalCenter?: boolean;
}

const StyledH2 = styled(H2)<{ centerHeader?: boolean }>`
  text-align: ${({ centerHeader }) => (centerHeader ? 'center' : 'left')};
`;

const StyledCard = styled(CardInset)<{ verticalCenter?: boolean }>`
  ${({ verticalCenter }) =>
    verticalCenter &&
    `
    height: 100%;
    justify-content: center;
  `}
`;

const Teaser: React.FC<TeaserProps> = ({
  heading,
  href,
  description,
  role,
  centerHeader,
  verticalCenter,
}) => (
  <StyledCard
    verticalCenter={verticalCenter}
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
  </StyledCard>
);

export default Teaser;
