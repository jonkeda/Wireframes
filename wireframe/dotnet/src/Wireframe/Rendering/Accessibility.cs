using System.Text;

namespace Wireframe.Rendering;

/// <summary>The ARIA roles and attributes written into the SVG (<c>accessibility.ts</c>).</summary>
internal static class Accessibility
{
    /// <summary>What <c>getAriaAttributes</c> reads of a control.</summary>
    internal readonly struct AriaProps
    {
        public string? Label { get; init; }
        public string? Placeholder { get; init; }
        public bool Disabled { get; init; }
        public bool Required { get; init; }
        public bool Checked { get; init; }
        public bool Selected { get; init; }
        public bool Active { get; init; }
        /// <summary>Undefined (null) when the modifier is not written: the parser never sets a modifier to false.</summary>
        public bool? Expanded { get; init; }
        public JsValue Value { get; init; }
        public JsValue Min { get; init; }
        public JsValue Max { get; init; }
    }

    /// <summary><c>getAriaRole</c></summary>
    public static string GetAriaRole(string controlType) => controlType switch
    {
        "Button" => "button",
        "IconButton" => "button",
        "TextInput" => "textbox",
        "PasswordInput" => "textbox",
        "NumberInput" => "spinbutton",
        "DateInput" => "textbox",
        "TextArea" => "textbox",
        "Checkbox" => "checkbox",
        "Radio" => "radio",
        "Switch" => "switch",
        "Slider" => "slider",
        "Dropdown" => "combobox",
        "Menu" => "menu",
        "MenuItem" => "menuitem",
        "Tabs" => "tablist",
        "Tab" => "tab",
        "Table" => "table",
        "DataGrid" => "grid",
        "Tree" => "tree",
        "TreeItem" => "treeitem",
        "Progress" => "progressbar",
        "Link" => "link",
        "Image" => "img",
        "Icon" => "img",
        "Header" => "banner",
        "Footer" => "contentinfo",
        "Sidebar" => "navigation",
        "Card" => "article",
        "Modal" => "dialog",
        "Toast" => "alert",
        "Accordion" => "group",
        "Breadcrumb" => "navigation",
        "Pagination" => "navigation",
        "Stepper" => "navigation",
        _ => "group",
    };

    /// <summary><c>getAriaAttributes</c>: name and value, in the order the TypeScript sets them.</summary>
    public static List<KeyValuePair<string, string>> GetAriaAttributes(string controlType, AriaProps props)
    {
        var attrs = new List<KeyValuePair<string, string>>();
        void Set(string key, string value) => attrs.Add(new KeyValuePair<string, string>(key, value));

        if (!string.IsNullOrEmpty(props.Label))
        {
            Set("aria-label", props.Label!);
        }

        if (props.Disabled)
        {
            Set("aria-disabled", "true");
        }

        if (props.Required)
        {
            Set("aria-required", "true");
        }

        if (!string.IsNullOrEmpty(props.Placeholder))
        {
            Set("aria-placeholder", props.Placeholder!);
        }

        switch (controlType)
        {
            case "Checkbox":
            case "Switch":
                Set("aria-checked", props.Checked ? "true" : "false");
                break;
            case "Radio":
                Set("aria-checked", props.Selected ? "true" : "false");
                break;
            case "Progress":
                if (props.Value.IsNumber)
                {
                    Set("aria-valuenow", props.Value.ToString());
                    Set("aria-valuemin", "0");
                    Set("aria-valuemax", props.Max.Or(100).ToString());
                }

                break;
            case "Slider":
                if (props.Value.IsNumber)
                {
                    Set("aria-valuenow", props.Value.ToString());
                    Set("aria-valuemin", props.Min.Or(0).ToString());
                    Set("aria-valuemax", props.Max.Or(100).ToString());
                }

                break;
            case "Dropdown":
                // props.open is never given: always false
                Set("aria-expanded", "false");
                Set("aria-haspopup", "listbox");
                break;
            case "Tab":
                Set("aria-selected", props.Active ? "true" : "false");
                break;
            case "TreeItem":
                if (props.Expanded is bool expanded)
                {
                    Set("aria-expanded", expanded ? "true" : "false");
                }

                break;
            case "Modal":
                Set("aria-modal", "true");
                break;
        }

        return attrs;
    }

    /// <summary><c>formatAriaAttributes</c>: <c>name="value"</c> joined by spaces, values escaped.</summary>
    public static string FormatAriaAttributes(List<KeyValuePair<string, string>> attrs)
    {
        var text = new StringBuilder();
        foreach (var pair in attrs)
        {
            if (text.Length > 0)
            {
                text.Append(' ');
            }

            text.Append(pair.Key).Append("=\"").Append(SvgText.EscapeXml(pair.Value)).Append('"');
        }

        return text.ToString();
    }
}
