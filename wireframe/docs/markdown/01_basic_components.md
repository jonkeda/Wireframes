# Basic Components

This document covers the fundamental UI components available in the Wireframe DSL.

## Buttons

Buttons are clickable controls that trigger actions.

```wireframe
wireframe clean
    Horizontal gap=8
        Button "Click Me"
        Button "Primary" primary
        Button "Secondary" secondary
        Button "Disabled" disabled
/wireframe
```

### Button Modifiers
- `primary` - Primary action styling (filled background)
- `secondary` - Secondary action styling
- `disabled` - Grayed out, non-interactive

## Icon Buttons

Buttons with icons for compact actions.

```wireframe
wireframe clean
    Horizontal gap=8
        IconButton icon=search
        IconButton icon=settings
        IconButton icon=menu
        IconButton "Edit" icon=edit
/wireframe
```

## Labels and Text

Display static text content.

```wireframe
wireframe clean
    Vertical gap=8
        Label "Plain text label"
        Label "**Bold label**"
        Label "*Italic label*"
        Heading "Large Heading" level=1
        Heading "Medium Heading" level=2
        Heading "Small Heading" level=3
/wireframe
```

### Text Formatting
- `**text**` - Bold text
- `*text*` - Italic text
- Use `Heading` with `level=1-6` for headings

## Links

Clickable text links.

```wireframe
wireframe clean
    Vertical gap=4
        Link "Click here for more"
        Link "External link" href="https://example.com"
/wireframe
```

## Icons

Display icons from the icon set.

```wireframe
wireframe clean
    Horizontal gap=12
        Icon icon=home
        Icon icon=settings
        Icon icon=user
        Icon icon=search
        Icon icon=menu
/wireframe
```

## Images

Display placeholder images.

```wireframe
wireframe clean
    Horizontal gap=16
        Image w=100 h=100
        Image "Product Photo" w=150 h=100
/wireframe
```

## Avatars

User profile pictures with size variants.

```wireframe
wireframe clean
    Horizontal gap=8
        Avatar "JD" size=xs
        Avatar "JD" size=sm
        Avatar "JD" size=md
        Avatar "JD" size=lg
        Avatar "JD" size=xl
/wireframe
```

### Avatar Sizes
- `xs` - Extra small (24px)
- `sm` - Small (32px)
- `md` - Medium (40px) - default
- `lg` - Large (56px)
- `xl` - Extra large (80px)

## Badges

Small status indicators.

```wireframe
wireframe clean
    Horizontal gap=8
        Badge "New"
        Badge "3" variant=info
        Badge "Done" variant=success
        Badge "Warning" variant=warning
        Badge "Error" variant=error
/wireframe
```

### Badge Variants
- Default - Neutral gray
- `variant=info` - Blue
- `variant=success` - Green
- `variant=warning` - Yellow
- `variant=error` - Red

## Separators and Spacers

Layout helper elements.

```wireframe
wireframe clean
    Vertical gap=8
        Label "Above separator"
        Separator
        Label "Below separator"
        Spacer h=20
        Label "After spacer"
/wireframe
```

## Progress Indicators

Show progress or loading states.

```wireframe
wireframe clean
    Vertical gap=16 w=300
        Progress value=75
        Progress value=50
        Progress value=25
/wireframe
```

## Chips

Tags or filter tokens.

```wireframe
wireframe clean
    Horizontal gap=8
        Chip "Technology"
        Chip "Design"
        Chip "React" removable
        Chip "Vue" removable
/wireframe
```

## Skeletons

Loading placeholder content.

```wireframe
wireframe clean
    Vertical gap=8
        Skeleton variant=text w=200
        Skeleton variant=rectangular w=300 h=100
        Skeleton variant=circular w=50 h=50
/wireframe
```
