# FLOUSTREAM UI layout standard

Status: approved reference standard, confirmed by the user on 2026-11-20.

## Reference

The approved reference is the WebShell test page in `android-web-shell-test/app/src/main/assets/index.html`, commit `38179b3f9cbc01f3774cc5c7cd802a5f61d98a4b`.

## Rules for every page

1. Adjacent content blocks have **0 px external vertical gap**. In the reference, `.panel` and `.tile` use `margin-top: 0`.
2. Content blocks use the full available page width (**100% of the available content viewport**) and share consistent left and right alignment. Do not introduce extra horizontal gutters between sibling blocks.
3. Preserve the reference's internal padding and the spacing inside components. Zero gap applies to the outside spacing between blocks, not to text padding, control spacing, or other intentional internal layout.
4. Keep the page scroll behavior and existing functionality unchanged when applying this layout standard.
5. Treat this as the default layout standard for all FLOUSTREAM pages, including new pages. Do not reintroduce gaps between blocks or inconsistent page-width gutters unless the user explicitly approves an exception.

## Change control

The approved reference implementation is immutable as a visual baseline. Apply the standard to other pages carefully, without changing their content, behavior, or unrelated styling. Verify each page after adaptation.
