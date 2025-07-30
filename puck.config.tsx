import { Config } from "@measured/puck";

// Define the types for our components
export type Props = {
  HeadingBlock: { title: string };
  TextBlock: { text: string };
  ButtonBlock: { text: string; href: string; variant: 'primary' | 'secondary' };
  ImageBlock: { src: string; alt: string; width?: number; height?: number };
  CardBlock: { title: string; description: string; image?: string };
};

// Puck configuration
export const config: Config<Props> = {
  categories: {
    layout: {
      title: "Layout",
      components: ["CardBlock"],
    },
    typography: {
      title: "Typography",
      components: ["HeadingBlock", "TextBlock"],
    },
    interactive: {
      title: "Interactive",
      components: ["ButtonBlock"],
    },
    media: {
      title: "Media",
      components: ["ImageBlock"],
    },
  },
  components: {
    HeadingBlock: {
      fields: {
        title: {
          type: "text",
        },
      },
      defaultProps: {
        title: "Heading",
      },
      render: ({ title }) => (
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", margin: "1rem 0" }}>
          {title}
        </h2>
      ),
    },
    TextBlock: {
      fields: {
        text: {
          type: "textarea",
        },
      },
      defaultProps: {
        text: "Lorem ipsum dolor sit amet",
      },
      render: ({ text }) => <p style={{ margin: "0.5rem 0", lineHeight: "1.6" }}>{text}</p>,
    },
    ButtonBlock: {
      fields: {
        text: {
          type: "text",
        },
        href: {
          type: "text",
        },
        variant: {
          type: "select",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
          ],
        },
      },
      defaultProps: {
        text: "Click me",
        href: "#",
        variant: "primary",
      },
      render: ({ text, href, variant }) => (
        <a
          href={href}
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: variant === "primary" ? "#3b82f6" : "#6b7280",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.375rem",
            fontWeight: "500",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              variant === "primary" ? "#2563eb" : "#4b5563";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              variant === "primary" ? "#3b82f6" : "#6b7280";
          }}
        >
          {text}
        </a>
      ),
    },
    ImageBlock: {
      fields: {
        src: {
          type: "text",
        },
        alt: {
          type: "text",
        },
        width: {
          type: "number",
        },
        height: {
          type: "number",
        },
      },
      defaultProps: {
        src: "https://via.placeholder.com/400x300",
        alt: "Placeholder image",
        width: 400,
        height: 300,
      },
      render: ({ src, alt, width, height }) => (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ maxWidth: "100%", height: "auto", borderRadius: "0.5rem" }}
        />
      ),
    },
    CardBlock: {
      fields: {
        title: {
          type: "text",
        },
        description: {
          type: "textarea",
        },
        image: {
          type: "text",
        },
      },
      defaultProps: {
        title: "Card Title",
        description: "This is a card description",
        image: "https://via.placeholder.com/300x200",
      },
      render: ({ title, description, image }) => (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            margin: "1rem 0",
          }}
        >
          {image && (
            <img
              src={image}
              alt={title}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
              }}
            />
          )}
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>
            {title}
          </h3>
          <p style={{ color: "#6b7280", margin: 0 }}>{description}</p>
        </div>
      ),
    },
  },
};

export default config;