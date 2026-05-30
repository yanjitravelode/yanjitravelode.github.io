#!/usr/bin/env python3
"""延边州旅游客流竞争Logistic模型"""
import numpy as np
from scipy.optimize import curve_fit
from scipy.integrate import solve_ivp
import json, os, warnings
warnings.filterwarnings('ignore')

CITIES = {
    1:  {'name': '延吉市', 'data': {2021:590.40,2022:641,2023:877.9,2024:1080,2025:1160}},
    2:  {'name': '图们市', 'data': {2022:103.2,2023:210,2024:249,2025:277}},
    3:  {'name': '敦化市', 'data': {2022:385,2023:692,2024:820.6}},
    4:  {'name': '珲春市', 'data': {2021:271,2022:193.62,2023:557.73,2024:800.86,2025:1200}},
    5:  {'name': '龙井市', 'data': {2021:204.53,2022:188.56,2023:478.25,2024:496.34,2025:456.37}},
    6:  {'name': '和龙市', 'data': {2021:181,2022:199,2024:744.3}},
    7:  {'name': '汪清县', 'data': {2021:24,2022:25,2023:98.3,2024:116}},
    8:  {'name': '安图县', 'data': {2022:367,2023:767,2024:890,2025:1038.4}},
    9:  {'name': '长白山', 'data': {2021:301.67,2022:149.28,2023:274.81,2024:339.84,2025:409.73}},
}

# Coordinates and distance
COORDS = {
    1:(129.5088,42.8913),2:(129.8439,42.9680),3:(128.2322,43.3728),
    4:(130.3660,42.8625),5:(129.4270,42.7663),6:(129.0108,42.5464),
    7:(129.7712,43.3128),8:(128.8997,43.1116),9:(128.0552,42.0348)
}
def haversine(lon1,lat1,lon2,lat2):
    R=6371;dlon=np.radians(lon2-lon1);dlat=np.radians(lat2-lat1)
    a=np.sin(dlat/2)**2+np.cos(np.radians(lat1))*np.cos(np.radians(lat2))*np.sin(dlon/2)**2
    return R*2*np.arctan2(np.sqrt(a),np.sqrt(1-a))

DIST=np.zeros((10,10))
for i in range(1,10):
    for j in range(1,10):
        if i!=j: DIST[i][j]=haversine(*COORDS[i],*COORDS[j])

def logistic(t,K,r,N0,t0):
    return K/(1+(K/N0-1)*np.exp(-r*(t-t0)))

print('='*60)
print('Stage 1: Independent Logistic Fit')
print('='*60)

fits={}
for cid in range(1,10):
    info=CITIES[cid];data=info['data']
    years=np.array(sorted(data.keys()));visitors=np.array([data[y] for y in years])
    t0=years[0];t_data=years-t0;N0_val=visitors[0]
    K0=visitors[-1]*2.0
    try:
        popt,_=curve_fit(lambda t,K,r:logistic(t+t0,K,r,N0_val,t0),t_data,visitors,
                          p0=[K0,0.25],bounds=([visitors[-1]*1.05,0.01],[visitors[-1]*10,1.5]),maxfev=5000)
        K_fit,r_fit=popt;fitted=logistic(years,K_fit,r_fit,N0_val,t0)
        ss_res=np.sum((visitors-fitted)**2);ss_tot=np.sum((visitors-np.mean(visitors))**2)
        r2=1-ss_res/ss_tot if ss_tot>0 else 0
    except:
        r_fit=0.2;K_fit=visitors[-1]*2.5;fitted=logistic(years,K_fit,r_fit,N0_val,t0)
        r2=0
    fits[cid]={'r':r_fit,'K':K_fit,'N0':N0_val,'t0':t0,'r2':r2,'fitted':fitted}
    print(f"  {info['name']:6s}  r={r_fit:.4f}  K={K_fit:.0f}  R2={r2:.3f}")

# Competition coefficients
alpha_base=0.08;lambda_dist=80.0
ALPHA=np.zeros((10,10))
for i in range(1,10):
    for j in range(1,10):
        if i!=j: ALPHA[i][j]=alpha_base*np.exp(-DIST[i][j]/lambda_dist)

# ODE system
def competition_ode(t,N,r_vec,K_vec,alpha):
    dNdt=np.zeros(9)
    for i in range(9):
        comp=sum(alpha[i+1][j+1]*N[j] for j in range(9) if j!=i)
        dNdt[i]=r_vec[i]*N[i]*(1-(N[i]+comp)/K_vec[i])
    return dNdt

r_vec=np.array([fits[i]['r'] for i in range(1,10)])
K_vec=np.array([fits[i]['K'] for i in range(1,10)])
N0_vec=np.array([list(CITIES[i]['data'].values())[0] for i in range(1,10)])

sol=solve_ivp(competition_ode,(2021,2035),N0_vec,args=(r_vec,K_vec,ALPHA),
              t_eval=np.arange(2021,2036,1.0),method='RK45',rtol=1e-6,atol=1e-3)

# Hotness
def compute_hotness(cid,N,K,r,alpha_row):
    max_r=max(fits[i]['r'] for i in range(1,10))
    sat=min(N/K,1.0);comp=sum(alpha_row[j]*sol.y[j-1][-1]/K for j in range(1,10) if j!=cid)
    return min(100,max(0,40*sat+30*(r/max_r)+30*(1-min(comp,1.0))))

results=[]
for i in range(9):
    cid=i+1;f=fits[cid];N_2025=sol.y[i][-1];K=f['K']
    hot=compute_hotness(cid,N_2025,K,f['r'],ALPHA[cid])
    y80=None
    for j,t in enumerate(sol.t):
        if sol.y[i][j]>=0.8*K: y80=int(t);break
    fy=sorted(CITIES[cid]['data'].keys())
    results.append({
        'city_id':cid,'city_name':CITIES[cid]['name'],
        'r':round(f['r'],4),'K':round(K,1),'r_squared':round(f['r2'],3),
        'hotness':round(hot,1),'year80':y80,
        'fitted':[[int(y),round(v,1)] for y,v in zip(fy,f['fitted'])],
        'predicted':[[int(t),round(sol.y[i][j],1)] for j,t in enumerate(sol.t) if t>2025],
        'competition_coeffs':{str(j):round(ALPHA[cid][j],4) for j in range(1,10) if j!=cid}
    })

output={'cities':sorted(results,key=lambda x:-x['hotness']),
        'metadata':{'model':'Lotka-Volterra Competition Logistic','method':'RK45',
                    'fitted_years':'2021-2025','predicted_years':'2026-2035'}}

out_path=os.path.join(os.path.dirname(__file__),'predictions.json')
with open(out_path,'w',encoding='utf-8') as f:
    json.dump(output,f,ensure_ascii=False,indent=2)
print(f'\nSaved predictions: {out_path}')
print(f'Cities: {len(results)}')
for r in results:
    print(f'  {r["city_name"]:6s}  r={r["r"]:.4f}  K={r["K"]:.0f}  hot={r["hotness"]:.1f}')
