# GitOps Crash Course — ArgoCD Demo Project

> **YouTube Tutorial:** "GitOps Crash Course — From Code Push to Production with ArgoCD (2026)"

This project demonstrates a complete GitOps workflow using ArgoCD, Kubernetes, GitHub Actions, and Docker.

---

## 🏗️ Repository Structure

```
demo/
├── app/                        # Application code (App Repo)
│   ├── index.js                # Node.js Express API
│   ├── package.json
│   └── Dockerfile
├── k8s/                        # Kubernetes manifests (Config Repo)
│   ├── deployment.yaml
│   └── service.yaml
├── argocd/
│   └── application.yaml        # ArgoCD Application CRD
└── .github/
    └── workflows/
        └── ci.yaml             # GitHub Actions CI/CD pipeline
```

> **Note:** In a real GitOps setup, `app/` lives in one GitHub repo and `k8s/` + `argocd/` live in a **separate** config repo. They're combined here for convenience.

---

## ✅ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | Latest | [docker.com](https://docker.com) |
| kubectl | v1.29+ | `brew install kubectl` |
| minikube | v1.32+ | `brew install minikube` |
| ArgoCD CLI | v2.9+ | `brew install argocd` |

---

## 🚀 Step-by-Step Setup

### 1. Start your local Kubernetes cluster

```bash
minikube start --cpus 4 --memory 6g
```

### 2. Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready (takes ~2 minutes)
kubectl wait --for=condition=Ready pod \
  -l app.kubernetes.io/name=argocd-server \
  -n argocd --timeout=300s

# Verify installation
kubectl get pods -n argocd
```

### 3. Access the ArgoCD UI

```bash
# Get the initial admin password
ARGO_PWD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)
echo "Admin password: $ARGO_PWD"

# Port-forward the UI
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
```

Open **https://localhost:8080** in your browser.
- Username: `admin`
- Password: (from the command above)

### 4. (Optional) Login via ArgoCD CLI

```bash
argocd login localhost:8080 \
  --username admin \
  --password "$ARGO_PWD" \
  --insecure
```

### 5. Configure the repo URL

No fork needed — ArgoCD can watch this repo directly.
The `k8s/` folder already contains the manifests ArgoCD will sync.

Update `argocd/application.yaml` with your GitHub username if you cloned this repo:

```yaml
source:
  repoURL: https://github.com/<your-username>/argocd-gitops-crash-course
  path: k8s
```

> **Tip:** For production, keeping app code and k8s manifests in separate repos
> gives you independent access controls and cleaner history. For learning/demos,
> one repo is perfectly fine.

### 6. Deploy the ArgoCD Application

```bash
# Apply the Application manifest — this is what tells ArgoCD what to watch
kubectl apply -f argocd/application.yaml

# Check sync status
argocd app get gitops-demo

# to delete.
argocd app delete gitops-demo
kubectl delete application gitops-demo -n argocd

# Or watch in the UI — you should see the app appear and sync
```

### 7. Verify the deployment

```bash
# Check pods are running
kubectl get pods

# Port-forward the app (or use minikube service)
kubectl port-forward svc/gitops-demo-svc 3001:80 &

# Test the endpoint
curl http://localhost:3001/
```

---

## 🔄 Trigger a GitOps Deployment

Make any change to `k8s/deployment.yaml` (e.g., change replicas or image tag) and push:

```bash
git add k8s/deployment.yaml
git commit -m "feat: bump replicas to 3"
git push origin main
```

Watch ArgoCD detect the change and auto-sync:

```bash
# Watch sync status in real time
argocd app get gitops-demo --watch

# Or check in the UI
```

---

## 🏭 CI/CD Pipeline Setup (Full GitOps)

For the complete GitHub Actions CI/CD pipeline:

1. Create a GitHub PAT with `repo` write access to your config repo
2. Add it as a secret named `CONFIG_REPO_PAT` in your **app repo** Settings → Secrets
3. Update `your-org` references in `.github/workflows/ci.yaml` to your GitHub username/org

After setup — push any code change to the app repo and watch the full loop:
```
Code push → GitHub Actions → Docker image built → Manifest updated → ArgoCD syncs → K8s deploys
```

---

## ↩️ Rolling Back

### Option 1: Git revert (recommended)
```bash
git revert HEAD --no-edit
git push origin main
# ArgoCD auto-syncs the revert
```

### Option 2: ArgoCD CLI
```bash
argocd app history gitops-demo     # List revisions
argocd app rollback gitops-demo 2  # Roll back to revision 2
```

### Option 3: ArgoCD UI
1. Open the app → click **History and Rollback**
2. Select a previous revision → click **Rollback**

---

## 🔐 Secrets Management

For production, never commit raw secrets. Options:

```bash
# Sealed Secrets — install
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml

# Seal a secret
kubectl create secret generic my-secret --dry-run=client \
  -o json --from-literal=password=mysecret | \
  kubeseal --format yaml > k8s/sealed-secret.yaml
# Now safe to commit sealed-secret.yaml!
```

---

## 🧹 Cleanup

```bash
# Remove the ArgoCD application (also removes K8s resources due to finalizer)
argocd app delete gitops-demo

# Remove ArgoCD
kubectl delete namespace argocd

# Stop minikube
minikube stop
```

---

## 📚 Resources

- [ArgoCD Docs](https://argo-cd.readthedocs.io/)
- [OpenGitOps Principles](https://opengitops.dev/)
- [ArgoCD App of Apps Pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
