# Dynamic Navigation System

## Quick Start

### Basic Usage

```tsx
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

export default function MyPage() {
  return (
    <RoleBasedLayout>
      <div>Your page content</div>
    </RoleBasedLayout>
  );
}
```

### Role-Specific Layout

```tsx
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";

export default function AdminPage() {
  return (
    <RoleBasedLayout
      allowedRoleIds={[1, 2]} // SuperAdmin, AdminClinica
      allowedRoleNames={['SuperAdmin', 'AdminClinica']}
      fallbackRoute="/dashboard"
    >
      <div>Admin content</div>
    </RoleBasedLayout>
  );
}
```

### Custom Navigation

```tsx
import { Navigation } from "@/components/layout/Navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CustomLayout({ children }) {
  return (
    <div className="flex">
      <Navigation />
      <main>
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
}
```

## Components

### Navigation
Fetches and renders menu based on user role from API.

### Breadcrumbs
Automatic breadcrumb generation from pathname.

### RoleBasedLayout
Layout wrapper with role verification and access control.

### AccessDenied
Error component for unauthorized access.

### NavigationErrorBoundary
Error boundary for navigation errors.

