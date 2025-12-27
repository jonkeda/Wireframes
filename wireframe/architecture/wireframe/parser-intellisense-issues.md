# Parser & IntelliSense Issues - Root Cause Analysis

**Date**: December 27, 2025  
**Status**: ✅ RESOLVED  
**Author**: GitHub Copilot

---

## Executive Summary

The user reported IntelliSense errors in VS Code for `.wire` example files. Investigation and fixes applied:

1. **Parser updated** - Now requires content inside `wireframe` to be indented
2. **All example and theme files updated** - Content now properly indented under `wireframe`
3. **TextMate grammar updated** - Added missing modifiers and components
4. **VS Code extension rebuilt and reinstalled**

---

## Issues Reported & Resolutions

### Issue 1: `%title` and `Vertical` Indentation

**Original Syntax (incorrect):**
```wireframe
wireframe clean
%title: Accordion Examples

Vertical gap=16
```

**Corrected Syntax:**
```wireframe
wireframe clean
    %title: Accordion Examples

    Vertical gap=16
```

**Resolution:**  
- Updated parser to expect INDENT after `wireframe <style>`
- Updated all 34 example files and 5 theme files with proper indentation
- Created utility script `scripts/indent-wireframes.cjs` for future use
