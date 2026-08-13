# Test Cases: Modernized HR Detail UI & Table UX

## 1. Employee Detail Page (Modernized UI)
- [ ] **Card-in-Card Layout**: Verify all sections (Personal, Org, Management, Salary) are displayed as separate Cards within a Tab pane.
- [ ] **InfoItem Components**: Ensure each field (e.g., Name, Email, Phone) is rendered using the custom `InfoItem` with its respective icon and label.
- [ ] **Salary Section (Current)**:
    - [ ] Verify background is white with a soft shadow and neutral (gray/blue) border.
    - [ ] Ensure "Total Income" (Tổng thu nhập) row is highlighted with bold text and a subtle divider, but NO green background.
    - [ ] Check if the M1-M3 mechanism table is neutral (gray header, no green text).
- [ ] **Salary Section (Pending)**:
    - [ ] Verify yellow warning border and icons are present to indicate an exceptional state.
    - [ ] Ensure "Total Income" highlight uses yellow-themed colors.
- [ ] **Security (VI Role)**:
    - [ ] Log in as a VI user.
    - [ ] Access an employee detail page.
    - [ ] Confirm "Thông tin tiền lương" section is completely hidden.
- [ ] **Responsive Design**:
    - [ ] View the page on a mobile device (or toggle dev tools).
    - [ ] Verify padding is reduced (`4px`), Breadcrumbs are hidden, and the layout stacks correctly.

## 2. Employee List & Table UX
- [ ] **Minimalist Actions**:
    - [ ] Verify "Hành động" column header is renamed to "Act.".
    - [ ] Confirm the "View" (Eye) icon is removed.
    - [ ] Check if clicking on "Mã nhân sự" correctly navigates to the detail page.
- [ ] **Header Alignment**:
    - [ ] Verify all table headers in `EmployeeListPage` and `PendingRoomPage` are centered.
- [ ] **Multi-select Block Filter**:
    - [ ] Open the filter on the "Khối" column.
    - [ ] Select multiple blocks (e.g., Admicro, Adtech).
    - [ ] Confirm the table filters correctly for ALL selected blocks.

## 3. General Layout
- [ ] **Pixel-Perfect Alignment**:
    - [ ] Check the sidebar logo area and page header alignment.
    - [ ] Confirm both heights are exactly 64px and the top horizontal line is perfectly straight across both sections.
