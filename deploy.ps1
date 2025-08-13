# AI.UP Frontend 재배포 스크립트
Write-Host "=== AI.UP Frontend 재배포 시작 ===" -ForegroundColor Green

# 1. 빌드
Write-Host "빌드 중..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "빌드 완료!" -ForegroundColor Green
    
    # 2. 배포
    Write-Host "Azure Static Web Apps에 배포 중..." -ForegroundColor Yellow
    swa deploy ./build --app-name ai-up-frontend --resource-group ai-up-resource-group
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "=== 재배포 완료! ===" -ForegroundColor Green
        Write-Host "Preview URL: https://salmon-field-0d3db0a00-preview.eastasia.1.azurestaticapps.net" -ForegroundColor Cyan
    } else {
        Write-Host "배포 실패!" -ForegroundColor Red
    }
} else {
    Write-Host "빌드 실패!" -ForegroundColor Red
}

