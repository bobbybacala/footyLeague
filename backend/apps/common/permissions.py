from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.common.auth import EDITOR, get_request_role


class AppRolePermission(BasePermission):
    """Allow reads for everyone; writes require a valid editor token."""

    message = "Editor access required for this action."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return get_request_role(request) == EDITOR
