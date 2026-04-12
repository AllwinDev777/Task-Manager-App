document.addEventListener('DOMContentLoaded', function() {
    // Find all role select dropdowns and submit the form when changed
    const roleSelects = document.querySelectorAll('.role-select');
    roleSelects.forEach(select => {
        select.addEventListener('change', function() {
            this.closest('form').submit();
        });
    });

     const deleteUser = document.querySelectorAll('.delete-user-btn');
    deleteUser.forEach(button => {
        button.addEventListener('click', function(event) {
            if (!confirm('Are you sure you want to delete this user?')) {
                event.preventDefault();
            }
        });
    });

});