import "./AstradrawLogo.scss";

const LogoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="AstradrawLogo-icon"
  >
    <g fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.9292 37.5398L35.0398 45.5708L37.5708 43.9602L32.4602 35.9292L29.9292 37.5398Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.0708 37.5398L12.9602 45.5708L10.4292 43.9602L15.5398 35.9292L18.0708 37.5398Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.5 36.5V44H22.5V36.5H25.5Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.5 1V6.5H22.5V1H25.5Z"
      />
      <path d="M46.2808 32H1.71924L3.21924 38H44.7808L46.2808 32Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M41 10.5C41 8.567 39.433 7 37.5 7L10.5 7C8.56701 7 7 8.567 7 10.5L7 29L4 29L4 10.5C4 6.91015 6.91015 4 10.5 4L37.5 4C41.0899 4 44 6.91015 44 10.5L44 29L41 29L41 10.5Z"
      />
    </g>
  </svg>
);

const LogoText = () => (
  <svg
    viewBox="0 0 240 40"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    className="AstradrawLogo-text"
  >
    <text
      x="0"
      y="30"
      fill="currentColor"
      fontFamily="'Assistant', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontSize="32"
      fontWeight="700"
      letterSpacing="-0.02em"
    >
      AstraDraw
    </text>
  </svg>
);

type LogoSize = "xs" | "small" | "normal" | "large" | "custom" | "mobile";

interface LogoProps {
  size?: LogoSize;
  withText?: boolean;
  style?: React.CSSProperties;
}

export const AstradrawLogo = ({
  style,
  size = "small",
  withText,
}: LogoProps) => {
  return (
    <div className={`AstradrawLogo is-${size}`} style={style}>
      <LogoIcon />
      {withText && <LogoText />}
    </div>
  );
};

// Also export the icon for use in other places (like menu items)
export const AstradrawIcon = LogoIcon;
