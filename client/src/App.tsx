import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import ProtectedRoute from "@/components/auth/protected-route"
import RequireWorkspace from "@/components/auth/require-workspace"
import LoginPage from "@/pages/login/page"
import SignupPage from "@/pages/signup/page"
import ForgotPasswordPage from "@/pages/forgot-password/page"
import OtpPage from "@/pages/otp/page"
import TwoFactorPage from "@/pages/2fa/page"
import CreateWorkspacePage from "@/pages/create-workspace/page"
import OrganizationSettingsPage from "@/pages/settings/organization/page"
import IntegrationsPage from "@/pages/integrations/page"
import ApiKeysSettingsPage from "@/pages/settings/api-keys/page"
import PersonalSettingsPage from "@/pages/settings/personal/page"
import TeamSettingsPage from "@/pages/settings/team/page"
import AppearanceSettingsPage from "@/pages/settings/appearance/page"
import RolesSettingsPage from "@/pages/settings/roles/page"
import CreateRolePage from "@/pages/settings/roles/new/page"
import EditRolePage from "@/pages/settings/roles/[roleId]/page"
import AutomationsPage from "@/pages/automations/page"
import NewAutomationPage from "@/pages/automations/new-automation/page"
import DataModelSettingsPage from "@/pages/settings/data-model/page"
import NewObjectPage from "@/pages/settings/data-model/new/page"
import ObjectDetailPage from "@/pages/settings/data-model/[objectId]/page"
import BillingSettingsPage from "@/pages/settings/billing/page"
import SettingsSectionPage from "@/pages/settings/coming-soon"
import SecuritySettingsPage from "@/pages/settings/security/page"
import SsoPage from "@/pages/settings/sso/page"
import PluginPage from "@/pages/settings/plugin/page"
import DomainsPage from "@/pages/settings/domains/page"
import WebhooksPage from "@/pages/settings/webhooks/page"
import AuditLogPage from "@/pages/settings/audit-log/page"
import DataExportPage from "@/pages/settings/data-export/page"
import MonitoringPage from "@/pages/settings/monitoring/page"
import NotificationsSettingsPage from "@/pages/settings/notifications/page"
import ChatPage from "@/pages/chat/page"
import HomePage from "@/pages/home/page"
import LocationsPage from "@/pages/locations/page"
import ProfilePage from "@/pages/profile/page"
import MediaPage from "@/pages/media/page"
import ReviewsPage from "@/pages/reviews/page"
import PostsPage from "@/pages/posts/page"
import MessagesPage from "@/pages/messages/page"
import QaPage from "@/pages/qa/page"
import PerformancePage from "@/pages/performance/page"
import ReportsPage from "@/pages/reports/page"
import TasksPage from "@/pages/tasks/page"
import StoragePage from "@/pages/storage/page"

const RedirectLegacyDataModelObject = () => {
  const { objectId } = useParams<{ objectId: string }>()
  return <Navigate to={`/settings/data-model/${objectId}`} replace />
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="otp" element={<OtpPage />} />
        <Route path="2fa" element={<TwoFactorPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="create-workspace" element={<CreateWorkspacePage />} />

          <Route element={<RequireWorkspace />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="qa" element={<QaPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="storage" element={<StoragePage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route
                path="data-models"
                element={<Navigate to="/settings/data-model" replace />}
              />
              <Route
                path="data-models/new"
                element={<Navigate to="/settings/data-model/new" replace />}
              />
              <Route
                path="data-models/:objectId"
                element={<RedirectLegacyDataModelObject />}
              />
              <Route path="automations" element={<AutomationsPage />} />
              <Route path="automations/new" element={<NewAutomationPage />} />

              <Route path="settings">
                <Route
                  index
                  element={<Navigate to="organization" replace />}
                />
                <Route path="personal" element={<PersonalSettingsPage />} />
                <Route path="appearance" element={<AppearanceSettingsPage />} />
                <Route
                  path="notifications"
                  element={<NotificationsSettingsPage />}
                />
                <Route
                  path="organization"
                  element={<OrganizationSettingsPage />}
                />
                <Route path="team" element={<TeamSettingsPage />} />
                <Route path="billing" element={<BillingSettingsPage />} />
                <Route path="domains" element={<DomainsPage />} />
                <Route path="plugin" element={<PluginPage />} />
                <Route path="security" element={<SecuritySettingsPage />} />
                <Route path="sso" element={<SsoPage />} />
                <Route path="webhooks" element={<WebhooksPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
                <Route path="data-export" element={<DataExportPage />} />
                <Route path="monitoring" element={<MonitoringPage />} />
                <Route
                  path="integrations"
                  element={<Navigate to="/integrations" replace />}
                />
                <Route path="api-keys" element={<ApiKeysSettingsPage />} />
                <Route path="roles" element={<RolesSettingsPage />} />
                <Route path="roles/new" element={<CreateRolePage />} />
                <Route path="roles/:roleId" element={<EditRolePage />} />
                <Route
                  path="automations"
                  element={<Navigate to="/automations" replace />}
                />
                <Route
                  path="automations/new"
                  element={<Navigate to="/automations/new" replace />}
                />
                <Route path="data-model" element={<DataModelSettingsPage />} />
                <Route path="data-model/new" element={<NewObjectPage />} />
                <Route
                  path="data-model/:objectId"
                  element={<ObjectDetailPage />}
                />
                <Route path=":section" element={<SettingsSectionPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
