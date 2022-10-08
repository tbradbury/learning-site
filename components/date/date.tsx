import { styled, getColorCssFromTheme } from 'newskit';

interface DateProps {
  dateString: string;
  options?: Record<string, unknown>;
}

const StyledTime = styled.time`
  ${getColorCssFromTheme('color', 'neutral040')}
`;

const DateComponent: React.FC<DateProps> = ({ dateString, options = {} }) => {
  const date = new Date(dateString);
  return (
    <StyledTime dateTime={dateString} role='date-display'>
      {date.toLocaleDateString('en-GB', options)}
    </StyledTime>
  );
};

export default DateComponent;
