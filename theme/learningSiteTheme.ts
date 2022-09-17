import { createTheme, newskitLightTheme } from 'newskit';
import { typographyPresets } from './typographyPresets';

export const learningSiteTheme = createTheme({
  name: 'Learning Site Theme',
  baseTheme: newskitLightTheme,
  overrides: {
    stylePresets: {
      teaserWithBorder: {
        base: {
          borderStyle: 'solid',
          borderColor: '{{colors.neutral030}}',
          borderWidth: '{{borders.borderWidthDefault}}',
          borderRadius: '{{borders.borderRadiusRounded020}}',
        },
        hover: {
          borderColor: '{{colors.blue050}}',
          color: '{{colors.blue050}}',
        },
      },
      teaserInherit: {
        hover: {
          color: 'inherit',
        },
      },
      headerDisplay: {
        base: {
          textAlign: 'center',
        },
      },
    },
    typographyPresets,
  },
});
