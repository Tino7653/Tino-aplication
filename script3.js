document.addEventListener('DOMContentLoaded', function() {
            // Elements
            const taskForm = document.getElementById('taskForm');
            const taskList = document.getElementById('taskList');
            const emptyState = document.getElementById('emptyState');
            const taskCount = document.getElementById('taskCount');
            const clearCompleted = document.getElementById('clearCompleted');
            const filterAll = document.getElementById('filterAll');
            const filterActive = document.getElementById('filterActive');
            const filterCompleted = document.getElementById('filterCompleted');
            const successNotification = document.getElementById('successNotification');
            const successMessage = document.getElementById('successMessage');
            
            // Task data
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';
            
            // Initialize
            renderTasks();
            updateTaskCount();
            
            // Event listeners
            taskForm.addEventListener('submit', addTask);
            clearCompleted.addEventListener('click', deleteCompletedTasks);
            filterAll.addEventListener('click', () => setFilter('all'));
            filterActive.addEventListener('click', () => setFilter('active'));
            filterCompleted.addEventListener('click', () => setFilter('completed'));
            
            // Fonctions
            function addTask(e) {
                e.preventDefault();
                
                const name = document.getElementById('taskName').value;
                const date = document.getElementById('taskDate').value;
                const priority = document.getElementById('taskPriority').value;
                const description = document.getElementById('taskDescription').value;
                
                const newTask = {
                    id: Date.now(),
                    name,
                    date,
                    priority,
                    description,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                
                tasks.push(newTask);
                saveTasks();
                renderTasks();
                updateTaskCount();
                
                // Réinitialiser le formulaire
                taskForm.reset();
                document.getElementById('taskName').focus();
                
                // Planifier une notification si la date est dans le futur
                scheduleNotification(newTask);
            }
            
            function scheduleNotification(task) {
                const now = new Date();
                const taskDate = new Date(task.date);
                
                if (taskDate > now) {
                    const timeDiff = taskDate - now;
                    
                    setTimeout(() => {
                        showNotification(`Rappel: "${task.name}" commence maintenant!`);
                    }, timeDiff);
                }
            }
            
            function showNotification(message) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('TaskMaster Rappel', {
                        body: message,
                        icon: 'https://cdn-icons-png.flaticon.com/512/3161/3161837.png'
                    });
                } else if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('TaskMaster Rappel', {
                                body: message,
                                icon: 'https://cdn-icons-png.flaticon.com/512/3161/3161837.png'
                            });
                        }
                    });
                }
                
                //Afficher la notification dans l'application
                successMessage.textContent = message;
                successNotification.classList.remove('hidden');
                setTimeout(() => {
                    successNotification.classList.add('hidden');
                }, 3000);
            }
            
            function renderTasks() {
                // Filtrer les tâches en fonction du filtre actuel
                let filteredTasks = tasks;
                if (currentFilter === 'active') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                }
                
                if (filteredTasks.length === 0) {
                    emptyState.classList.remove('hidden');
                    taskList.innerHTML = '';
                    taskList.appendChild(emptyState);
                } else {
                    emptyState.classList.add('hidden');
                    
                    taskList.innerHTML = filteredTasks.map(task => `
                       <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                       <div class="task-content">
                         <div class="task-left">
                           <button class="complete-btn ${task.completed ? 'complete-checked' : ''}">
                             <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                           </button>
                           <div class="task-info">
                             <h3 class="task-title ${task.completed ? 'task-done' : ''}">${task.name}</h3>
                             <p class="task-date">${formatDate(task.date)}</p>
                             ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                           </div>
                         </div>
                         <div class="task-actions">
                           <button class="delete-btn">
                             <i class="fas fa-trash"></i>
                           </button>
                         </div>
                       </div>
                       <div class="task-footer">
                         <span class="priority-badge ${getPriorityClass(task.priority)}">${getPriorityText(task.priority)}</span>
                         <span class="task-time">Ajouté le ${formatDate(task.createdAt, true)}</span>
                       </div>
                       </div>
                    `).join('');
                    
                    // Ajouter des écouteurs d’événements à tous les boutons de tâche
                    document.querySelectorAll('.complete-btn').forEach(btn => {
                        btn.addEventListener('click', toggleTaskComplete);
                    });
                    
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', deleteTask);
                    });
                }
            }
            
            function toggleTaskComplete(e) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                
                task.completed = !task.completed;
                saveTasks();
                
                if (task.completed) {
                    showSuccessNotification(`Tâche "${task.name}" marquée comme terminée!`);
                    
                    // Ajouter une classe d'animation
                    taskItem.classList.add('task-completed');
                    
                    // Supprimer une fois l'animation terminée
                    setTimeout(() => {
                        renderTasks();
                        updateTaskCount();
                    }, 500);
                } else {
                    renderTasks();
                    updateTaskCount();
                }
            }
            
            function showSuccessNotification(message) {
                successMessage.textContent = message;
                successNotification.classList.remove('hidden');
                
                setTimeout(() => {
                    successNotification.classList.add('hidden');
                }, 3000);
            }
            
            function deleteTask(e) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.id);
                
                // Rechercher une tâche pour obtenir un nom pour la notification
                const task = tasks.find(t => t.id === taskId);
                
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                
                showSuccessNotification(`Tâche "${task.name}" supprimée!`);
                
                // Ajouter une classe d'animation
                taskItem.classList.add('task-completed');
                
                // Supprimer une fois l'animation terminée
                setTimeout(() => {
                    renderTasks();
                    updateTaskCount();
                }, 500);
            }
            
            function deleteCompletedTasks() {
                const completedCount = tasks.filter(t => t.completed).length;
                
                if (completedCount > 0) {
                    tasks = tasks.filter(task => !task.completed);
                    saveTasks();
                    
                    showSuccessNotification(`${completedCount} tâche(s) terminée(s) supprimée(s)!`);
                    renderTasks();
                    updateTaskCount();
                }
            }
            
            function setFilter(filter) {
                currentFilter = filter;
                
                // Mettre à jour le bouton actif
                [filterAll, filterActive, filterCompleted].forEach(btn => {
                  btn.classList.remove('active-filter');
                  btn.classList.add('btn-default');
                });
                
                if (filter === 'all') {
                  filterAll.classList.add('active-filter');
                } else if (filter === 'active') {
                  filterActive.classList.add('active-filter');
                } else {
                  filterCompleted.classList.add('active-filter');
                }
                
                renderTasks();
            }
            
            function updateTaskCount() {
                const activeCount = tasks.filter(task => !task.completed).length;
                const totalCount = tasks.length;
                
                taskCount.textContent = `${activeCount} tâche(s) active(s) sur ${totalCount}`;
            }
            
            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
            function formatDate(dateString, includeTime = false) {
                const date = new Date(dateString);
                const options = { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: includeTime ? '2-digit' : undefined,
                    minute: includeTime ? '2-digit' : undefined
                };
                return date.toLocaleDateString('fr-FR', options);
            }
            
            function getPriorityClass(priority) {
                return {
                    'high': 'priority-high',
                    'medium': 'priority-medium',
                    'low': 'priority-low'
                }[priority];
            }
            
            function getPriorityText(priority) {
                return {
                    'high': 'Haute priorité',
                    'medium': 'Priorité moyenne',
                    'low': 'Basse priorité'
                }[priority];
            }
            
            // Demander l'autorisation de notification lors du chargement de la page
            if ('Notification' in window) {
                Notification.requestPermission();
            }
        });