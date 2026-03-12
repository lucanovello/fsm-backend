# Kubernetes Manifests

These manifests are starter templates for running `fsm-backend` on Kubernetes.

- Update namespace, hostnames, and image tags before applying.
- Keep sensitive values in Kubernetes Secrets or an external secrets manager.
- Validate `TRUST_PROXY`, metrics guard settings, and ingress/network policy alignment in each environment.
